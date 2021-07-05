const config = require("../config/auth.config");
var jwt = require("jsonwebtoken");

exports.signin = (req, res) => {
    const scriptFile = 'app/scripts/login.ps1'
    const execSync = require('child_process').execSync
    const spawnSync = require('child_process').spawnSync
    const login = req.body.name
    const password = req.body.password
    const cmd2 = `powershell.exe -ExecutionPolicy ByPass -File ${scriptFile} ${login} `
    const cmd = cmd2 + `${password}`
    console.log('----->' + cmd2)
    let data
    let err
    let execRes
    let errCode
    let groups = ''
    try {
        // Old version with execSync
        //data = execSync(cmd, {encoding: 'utf-8'}).replace(/\n$/, '')

        execRes = spawnSync('powershell.exe', [ '-ExecutionPolicy', 'ByPass', '-File', scriptFile, login, password ], { encoding: 'utf-8' })
        data = execRes.stdout
        err = execRes.stderr
        if (err) {
            console.log(err)
            return res.status(500).send('Error executing script ' + scriptFile + ': ' + err)
        }
        errCode = execRes.status
        data = data.replace(/\n$/, '')
        console.log(data)
    }
    catch (error) {
        errCode = error.status;  // Might be 127 in your example.
        //error.message; // Holds the message you typically want.
        //error.stderr;  // Holds the stderr output. Use `.toString()`.
        //error.stdout;  // Holds the stdout output. Use `.toString()`.
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

    var token = jwt.sign({ id: login, groups: groups }, config.secret, {
        expiresIn: 3600 // 8 hour // 86400 = 24 hours
    });

    res.status(200).send({
        name: login,
        groups: groups,
        rootItems: arr,
        accessToken: token
    });
};
