const config = require("../config/config");
const helper = require("./helperfunc.js").data;

exports.allAccess = (req, res) => {
  res.status(200).send("Welcome to Bell public content");
};

function secrets(fs, tags) {
	res = ""
	tags.split("###").forEach( function(val,index,array) {
		if ((index & 1) == 0) { res += val }
		else if (config.secrets.has(val)) { return config.secrets.get(val) }
		else {
			helper.loggy(fs, 2, "SECRET not found: '" + val + "' (case sensitive)")
			res += val
		}
	})
	return tags
}

// sort names, case is ignored.
// sort by priority, which is after ; then by name 
// default priority (if no ;) - 100

function getPriority(name) {
	a = name.split(';')
	if (a.length == 1) return '00100';
    return ("00000"+a[1]).slice(-5);
}

function sorter(a, b) { 
    if (a.priority < b.priority) return -1;
    if (a.priority > b.priority) return 1;
	// a.priority == b.priority
	if (a.name.toString().toLowerCase() < b.name.toString().toLowerCase()) return -1;
    if (a.name.toString().toLowerCase() > b.name.toString().toLowerCase()) return 1;
    return 0;
}


exports.expand = async (req, res) => {
    const fs = require('fs')
    const execSync = require('child_process').execSync
    const spawnSync = require('child_process').spawnSync
    const scriptsDir = config.scripts_directory.replace(/\/$/, "")
    try {
        const dir = fs.opendirSync(scriptsDir)
        let dirEnt
        let arrFull = []
        let fileIndex = 0
        while ((dirEnt = dir.readSync()) !== null) {
            if (dirEnt.name.startsWith((req.body.item.nodeclass + '_')) ) {
                const scriptFile = scriptsDir + '/' + dirEnt.name
                let data
                let err
                let execRes
				let parlist
				let executor

                if (scriptFile.endsWith('.ps1') || scriptFile.endsWith('.py')) {
                    // PowerShell script or Python script
                    let userName = req.userId
                    let userGroups = req.userGroups
                    let nodeName = req.body.item.name
					let nodeTags = secrets(fs, req.body.item.nodetags)
                    let [executor, parlist, parlistQ] = helper.script_command(scriptFile, [userName, userGroups, nodeName, nodeTags])
                    if (config.log_commands) helper.loggy(fs, 0, 'EXEC => ' + executor + " " + parlistQ.join(" "))
                    try {
                        execRes = spawnSync(executor, parlist, { encoding: 'utf-8' })
                        data = execRes.stdout
                        err = execRes.stderr
                        if (err) {
                            if (config.log_errors) helper.loggy(fs, 2, "ERR => " + err)
							auditErr = helper.exec_audit(spawnSync, fs, scriptsDir, scriptFile, userName, userGroups, nodeName, nodeTags, helper.strip(err)) 
							if (auditErr) { return res.status(500).send(err+ " " + auditErr) }
                            return res.status(500).send('Error executing script ' + scriptFile + ': ' + err)
                        }
                        data = data.replace(/\n$/, '')
                        if (config.log_folder) helper.loggy(fs, 3, data)
						auditErr = helper.exec_audit(spawnSync, fs, scriptsDir, scriptFile, userName, userGroups, nodeName, nodeTags, "") 
						if (auditErr) { return res.status(500).send(auditErr) }
                    }
                    catch (error) {
                        errCode = error.status;
                        helper.loggy(fs, 2, 'ERROR ==> ' + error.message)
                        return res.status(500).send('Error executing script ' + scriptFile + ': \n' + error.message)
                    }

                    data = data.replace(/\r$/, '')
                } else if (scriptFile.endsWith('.txt')) {
                    // Text file
                    data = fs.readFileSync(scriptFile, 'utf8')
                } else {
                    continue
                }

                // name | class | type | tags
                let arr = data.split('\n')
                                .map(function (el, index) {
                                    let a = el.split('|')
                                    let obj = {
                                        'id': req.body.item.id + '.' + dirEnt.name + '.' + index.toString(), // Generate unique node id
                                        'name': (a[0] ? a[0].split(';')[0] : '(No data)'),
										'priority': (a[0] ? getPriority(a[0]) : '00000'),
                                        'nodeclass': a[1],
                                        'nodetype': (typeof a[2] !== 'undefined' ? a[2] : 'empty'),
                                        'nodetags': (typeof a[3] !== 'undefined' ? a[3].replace(/\r$/, '') : ''),
                                        'children': (a[2] == 'folder' ? [] : null)
                                    }
                                    if (a[2] != 'folder') {
                                        delete obj.children
                                    }
                                    return obj
                                })

                arrFull.push(...arr)
                fileIndex++
            }
        }
        dir.closeSync()
        arrFull = arrFull.sort( sorter )
        return res.status(200).send(arrFull)

    } catch (err) {
        console.error(err)
        return res.status(500).send(err.message)
    }

    return res.status(200).send([])
};


exports.getContent = async (req, res) => {
    const fs = require('fs')
    const execSync = require('child_process').execSync
    const spawnSync = require('child_process').spawnSync
    const scriptsDir = config.scripts_directory.replace(/\/$/, "")
    try {

        const partFile = scriptsDir + '/' + req.body.item.nodeclass
		scriptFile = helper.extSniffer(fs, partFile)
        if (scriptFile > "") {
            let data
            let err
            let execRes

            // PowerShell script or Python script
            let userName = req.userId
            let userGroups = req.userGroups
            let nodeName = req.body.item.name
            let nodeTags = secrets(fs, req.body.item.nodetags)
            let [executor, parlist, parlistQ] = helper.script_command(scriptFile, [userName, userGroups, nodeName, nodeTags])
            if (config.log_commands) helper.loggy(fs, 0, 'EXEC => ' + executor + " " + parlistQ.join(" "))
            try {
                execRes = spawnSync(executor, parlist, { encoding: 'utf-8' })
                data = execRes.stdout
                err = execRes.stderr
                if (err) {
					if (config.log_errors) helper.loggy(fs, 2, "ERR => " + err)
					auditErr = helper.exec_audit(spawnSync, fs, scriptsDir, scriptFile, userName, userGroups, nodeName, nodeTags, helper.strip(err)) 
					if (auditErr) { return res.status(500).send(err+ " " + auditErr) }
                    return res.status(500).send('Error executing script ' + scriptFile + ': \n' + err)
                }
				if (config.log_data) helper.loggy(fs, 3, data)
				auditErr = helper.exec_audit(spawnSync, fs, scriptsDir, scriptFile, userName, userGroups, nodeName, nodeTags, "") 
				if (auditErr) { return res.status(500).send(auditErr) }
                data = data.replace(/\n$/, '')
            }
            catch (error) {
                errCode = error.status;  // Might be 127 in your example.
				helper.loggy(fs, 2, "ERR => " + error.message)
                return res.status(500).send('Error executing script ' + scriptFile + ': \n' + error.message)
            }

            if (req.body.item.nodetype === 'file') {
                // File name returned

                let fileName
                try {
                    fileName = data.replace(/\r$/, '')
                    data = fs.readFileSync(fileName, 'utf8')
                    let shortName = fileName.replace(/^.*[\\\/]/, '')
                    data = shortName + '@' + data
                } catch (err) {
					helper.loggy(fs, 2, "ERR => " + err)
                    return res.status(500).send('File for download not found: ' + escape(fileName))
                }
            }
            return res.status(200).send(data)
        }
        else {
            return res.status(500).send('Script ' + partFile + '.* not found')
        }
    } catch (err) {
        console.error(err)
        return res.status(500).send(err.message)
    }

    return res.status(200).send('')
};
