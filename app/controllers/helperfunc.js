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
  fs.appendFileSync(config.log_file, datestr + levels[severity] + " " + str);
};

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

	if (config.audit_enabled) { return "" } // skip altogether

	// audit can be PowerShell or python based
	let auditFile = scriptsDir + '/audit.ps1'
	if (! fs.existsSync(auditFile)) {
		auditFile = scriptsDir + '/audit.py'
		if (! fs.existsSync(auditFile)) {
			msg = "No audit file audit.ps1 or .py found in " + scriptsDir
			methods.loggy(fs, 0, "AUDITFILE => " + msg, logf)
			return msg
		}
	}
	
	const [executor, parlist, parlistQ] = methods.script_command(auditFile, [scriptFile, userName, userGroups, nodeName, nodeTags, errstat])
	if (config.log_audit_commands) methods.loggy(fs, 0, 'EXECAUDIT => ' + executor + " " + parlistQ.join(" "))
    let auditRes = spawnSync(executor, parlist, {encoding: 'utf-8'})
    auditErr = auditRes.stderr
	if (auditErr) {
		methods.loggy(fs, 2, "AUDITERR => " + auditErr) // always log as it is a fatal config problem
		return auditErr
	}
	
	return "" // ok
};

exports.data = methods;