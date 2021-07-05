exports.allAccess = (req, res) => {
  res.status(200).send("Welcome to Bell public content");
};

exports.expand = async (req, res) => {
    const fs = require('fs')
    const execSync = require('child_process').execSync
    const spawnSync = require('child_process').spawnSync
    try {
        const dir = fs.opendirSync('app/scripts')
        let dirEnt
        let arrFull = []
        let fileIndex = 0
        while ((dirEnt = dir.readSync()) !== null) {
            if (dirEnt.name.startsWith((req.body.item.nodeclass + '_')) ) {
                const scriptFile = 'app/scripts/' + dirEnt.name
                const auditFile = 'app/scripts/audit.ps1'
                let data
                let err
                let execRes

                if (scriptFile.endsWith('.ps1')) {
                    // PowerShell script
                    let userName = req.userId
                    let userGroups = req.userGroups
                    let nodeName = req.body.item.name
                    let nodeTags = req.body.item.nodetags
                    const creds = `"${userName}" "${userGroups}" "${nodeName}" "${nodeTags}"`
                    const cmd = `powershell.exe -ExecutionPolicy ByPass -File ${scriptFile} ${creds}`
                    console.log('=====>' + cmd)
                    try {
                        // Old version with execSync
                        //data = execSync(cmd, { encoding: 'utf-8' }).replace(/\n$/, '')

                        if (fs.existsSync(auditFile)) {
                            try {
                                let auditRes = spawnSync('powershell.exe', ['-ExecutionPolicy', 'ByPass', '-File', auditFile, userName, userGroups, nodeName, nodeTags], {encoding: 'utf-8'})
                                auditErr = auditRes.stderr
                                if (auditErr) {
                                    console.log(err)
                                    return res.status(500).send('Error in audit, contact administrator')
                                }
                            } catch (error) {
                                errCode = error.status;
                                console.error('ERROR IN AUDIT: ' + error.message)
                                return res.status(500).send('Error in audit, contact administrator')
                            }
                        }

                        execRes = spawnSync('powershell.exe', [ '-ExecutionPolicy', 'ByPass', '-File', scriptFile, userName, userGroups, nodeName, nodeTags ], { encoding: 'utf-8' })
                        data = execRes.stdout
                        err = execRes.stderr
                        if (err) {
                            console.log(err)
                            return res.status(500).send('Error executing script ' + scriptFile + ': ' + err)
                        }
                        data = data.replace(/\n$/, '')
                        console.log(data)
                    }
                    catch (error) {
                        errCode = error.status;
                        //error.message; // Holds the message you typically want.
                        //error.stderr;  // Holds the stderr output. Use `.toString()`.
                        //error.stdout;  // Holds the stdout output. Use `.toString()`.
                        console.error('ERROR: ' + error.message)
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
                                        'name': (a[0] ? a[0] : '(No data)'),
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
        arrFull = arrFull.sort(
            function(a, b) {
                if (a.name.toString().toLowerCase() < b.name.toString().toLowerCase()) return -1;
                if (a.name.toString().toLowerCase() > b.name.toString().toLowerCase()) return 1;
                return 0;
            }
        )

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
    try {

        const scriptFile = 'app/scripts/' + req.body.item.nodeclass + '.ps1'
        const auditFile = 'app/scripts/audit.ps1'

        if (fs.existsSync(scriptFile)) {
            let data
            let err
            let execRes

            // PowerShell script
            let userName = req.userId
            let userGroups = req.userGroups
            let nodeName = req.body.item.name
            let nodeTags = req.body.item.nodetags

            const creds = `"${userName}" "${userGroups}" "${nodeName}" "${nodeTags}"`
            const cmd = `powershell.exe -ExecutionPolicy ByPass -File ${scriptFile} ${creds}`
            console.log('=====>' + cmd)

            try {
                // Old version with execSync
                //data = execSync(cmd, { encoding: 'utf-8' }).replace(/\n$/, '')

                if (fs.existsSync(auditFile)) {
                    try {
                        let auditRes = spawnSync('powershell.exe', ['-ExecutionPolicy', 'ByPass', '-File', auditFile, userName, userGroups, nodeName, nodeTags], {encoding: 'utf-8'})
                        let auditErr = auditRes.stderr
                        if (auditErr) {
                            console.log(err)
                            return res.status(500).send('Error in audit, contact administrator')
                        }

                    } catch (error) {
                        errCode = error.status;
                        console.error('ERROR IN AUDIT: ' + error.message)
                        return res.status(500).send('Error in audit, contact administrator')
                    }
                }

                execRes = spawnSync('powershell.exe', [ '-ExecutionPolicy', 'ByPass', '-File', scriptFile, userName, userGroups, nodeName, nodeTags ], { encoding: 'utf-8' })
                data = execRes.stdout
                err = execRes.stderr
                if (err) {
                    console.log(err)
                    return res.status(500).send('Error executing script ' + scriptFile + ': \n' + err)
                }
                data = data.replace(/\n$/, '')
                console.log(data)
            }
            catch (error) {
                errCode = error.status;  // Might be 127 in your example.
                //error.message; // Holds the message you typically want.
                //error.stderr;  // Holds the stderr output. Use `.toString()`.
                //error.stdout;  // Holds the stdout output. Use `.toString()`.
                console.error('ERROR: ' + error.message)
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
                    console.error(err)
                    return res.status(500).send('File for download not found: ' + escape(fileName))
                }
            }

            return res.status(200).send(data)
        }
        else {
            return res.status(500).send('Script ' + scriptFile + ' not found')
        }
    } catch (err) {
        console.error(err)
        return res.status(500).send(err.message)
    }

    return res.status(200).send('')
};
