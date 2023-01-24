const authConfig = require("../config/auth.config");
const config = require("../config/config");
const helper = require("./helperfunc.js").data;
var jwt = require("jsonwebtoken");

exports.signin = (req, res) => {
    const fs = require('fs')
	const partFile = config.scripts_directory.replace(/\/$/, "") + '/login'
    const scriptFile = helper.extSniffer(fs, partFile)
	if (scriptFile === "") { 
		helper.loggy(fs, 2, "No login file found! " + partFile + ".*") 
		return res.status(401).send({accessToken: null, message: "No login script found" })
	}
    const execSync = require('child_process').execSync
    const spawnSync = require('child_process').spawnSync
    const login = req.body.name
    const password = req.body.password
    let data
    let err
    let execRes
    let errCode
    let groups = ''
    try {
		let [executor, parlist] = helper.script_command(scriptFile, [login, password])
		helper.loggy(fs, 1, 'LOGIN => ' + executor + " " + parlist.join(" "))
        execRes = spawnSync(executor, parlist, { encoding: 'utf-8' })
        data = execRes.stdout
        err = execRes.stderr
        if (err) {
            if (config.log_errors) helper.loggy(fs, 2, "ERR => " + err)
            return res.status(500).send('Error executing script ' + scriptFile + ': ' + err)
        }
        errCode = execRes.status
        data = data.replace(/\n$/, '')
        console.log(data)
    }
    catch (error) {
        errCode = error.status;  // Might be 127 in your example.
        console.error('ERROR, CODE= ' + errCode + ', '  + error.message)
    }

    if (errCode == 1) {
        return res.status(401).send({
            accessToken: null,
            message: "Invalid User or Password!"
        });
    }

    //#line 1, return groups, for ex 'RO;RW'
    //#line 2..n returns root elements, always in the format: friendly name|class|type|tags

    let arr = data.split('\n')
        .map(function (el, index) {
            if (index == 0) {
                groups = el.replace(/\n$/, '')
                groups = groups.replace(/\r$/, '')
                return {
                    'id': null,
                    'name': null,
                    'nodeclass': null,
                    'nodetype': null,
                    'nodetags': null,
                    'children': null
                }
            }
            else {
                let a = el.split('|')
                let obj = {
                    'id': 'login' + index.toString(),
                    'name': a[0],
                    'nodeclass': a[1],
                    'nodetype': a[2],
                    'nodetags': a[3].replace(/\r$/, ''),
                    'children': (a[2] == 'folder' ? [] : null)
                }
                if (a[2] != 'folder') {
                    delete obj.children
                }
                return obj
            }
        })
    arr.shift() // remove groups (1st element)

    var token = jwt.sign({ id: login, groups: groups }, authConfig.secret, {
        expiresIn: 3600 // 8 hour // 86400 = 24 hours
    });

    res.status(200).send({
        name: login,
        groups: groups,
        rootItems: arr,
        accessToken: token
    });
};
