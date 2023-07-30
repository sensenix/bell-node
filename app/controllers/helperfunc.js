const config = require("../config/config");

var methods = {}

// remove ' " and multilines to pass error as string to audit
methods.strip = function (str) {
	str = str.replace(/['"]+/g,'')
	str = str.split(/\r?\n/).join(' ')
	return str
};

methods.extSniffer = function(fs, f) {
	let scriptFile = ""
	if (fs.existsSync(f + '.ps1')) { scriptFile = f + '.ps1' }
	else if (fs.existsSync(f + '.py')) { scriptFile = f + '.py' }
	return scriptFile
};

methods.loggy = function(fs, severity, str) { // 0 - info, 1 - yellow, 2 - red, 3 -  blue (data)
  const cols = ['\033[32m', '\033[33m', '\033[31m', '\033[34m']
  const levels = ['INFO', 'ATTN', 'ERR.', 'DATA']
  let datestr = ""
  if (severity<3) {
    let myDate = new Date();
     datestr = myDate.toISOString().substring(0,19) + " ";
  }
  console.log(datestr + cols[severity] + str + '\033[0m')
  let crlf = '\n'
  if (config.log_force_windows_crlf) { crlf = '\r\n' }
  fs.appendFileSync(config.log_file, datestr + levels[severity] + " " + str + crlf);
};

// clean dir
methods.clean_dir =  function(dir) {
	if (dir.length < 6) { return } // fool protection
	let p = process.platform;
	const execSync = require('child_process').execSync;
	let cmd;
	if (p === "win32") { cmd = 'pushd "' + dir + '" && (rd /s /q "' + dir + '" 2>nul & popd)' }
	else { cmd = 'rm -rfv ' + dir + '/*'  }
	try {
	  execSync(cmd, { stdio: 'ignore' });
	} catch (err) {
      loggy(fs, 2, 'ERROR ==> Failed to clean dir ' + dir + ' Errmsg: ' + err.message)
	}
}	

// returns command and some additional flags
methods.script_executor = function (script) {
	let p = process.platform
	if (p === "win32") 
	{
		if (script.endsWith(".ps1")) return [config.windows_ps1, config.windows_ps1_appendix]
		else return [config.windows_py, ""]
	}
	if (p === "linux") 
	{
		if (script.endsWith(".ps1")) return [config.linux_ps1, config.linux_ps1_appendix]
		else return [config.linux_py, ""]
	}
	return ["unsupported_os", p]
};

// params is an array
methods.script_command = function(script, params) {
	const [executor, suffix] = methods.script_executor(script)
	let parlist = []
	let parlistQ = []
	if (suffix != "") { parlist.concat(suffix.split(" ")) }
	parlist.push(script)
	parlistQ.push(script)
	params.forEach((item, index) => {
      if ((params.length == 2) && (index == 1)) { // this is password
	    parlistQ.push('"<<<<< Password hidden >>>>>"') 
	  }
	  else { parlistQ.push('"' + item + '"') }
	  if ((process.platform == "linux") || script.endsWith('py')) {
	    parlist.push(item)
	  } else {
	    parlist.push('"' + item + '"')
	  }
      });
	return [executor, parlist, parlistQ]
};

methods.exec_audit = function(spawnSync, fs, scriptsDir, scriptFile, userName, userGroups, nodeName, nodeTags, errstat) {

	if (! config.audit_enabled) { return "" } // skip altogether

	// audit can be PowerShell or python based
	let auditFile = scriptsDir + '/audit.ps1'
	if (! fs.existsSync(auditFile)) {
		auditFile = scriptsDir + '/audit.py'
		if (! fs.existsSync(auditFile)) {
			msg = "No audit file audit.ps1 or .py found in " + scriptsDir
			methods.loggy(fs, 0, "AUDITFILE => " + msg)
			return msg
		}
	}
	
	const [executor, parlist, parlistQ] = methods.script_command(auditFile, [scriptFile, userName, userGroups, nodeName, nodeTags, errstat])
	if (config.log_audit_commands) methods.loggy(fs, 0, 'EXECAUDIT => ' + executor + " " + parlistQ.join(" "))
	let wdir = config.work_directory + '/' + process.pid.toString();
    let auditRes = spawnSync(executor, parlist, {encoding: 'utf8', cwd: wdir })
    auditErr = auditRes.stderr
	if (auditErr) {
		methods.loggy(fs, 2, "AUDITERR => " + auditErr) // always log as it is a fatal config problem
		return auditErr
	}
	
	return "" // ok
};

methods.get_secret = function(spawnSync, fs, scriptsDir, secretTag) {

	// script secret.* can be PowerShell or python based
	let secretFile = scriptsDir + '/secret.ps1'
	if (! fs.existsSync(secretFile)) {
		secretFile = scriptsDir + '/secret.py'
		if (! fs.existsSync(secretFile)) {
			return [1,'secret script not found']
		}
	}
	
	const [executor, parlist, parlistQ] = methods.script_command(secretFile, [secretTag])
	if (config.log_secrets) methods.loggy(fs, 0, 'EXECSECRET => ' + executor + " " + parlistQ.join(" "))
	let wdir = config.work_directory + '/' + process.pid.toString();
    let secretRes = spawnSync(executor, parlist, {encoding: 'utf8', cwd: wdir })
    secretErr = secretRes.stderr
	if (secretErr) {
		methods.loggy(fs, 2, "SECRETERR => " + auditErr) 
		return [2,secretErr]
	}
	
	return [0,secretRes.stdout.replace(/(\r\n|\n|\r)/gm, "")] // remove line breaks if any, single line output is expected
};


exports.data = methods;