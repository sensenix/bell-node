module.exports = {

  PORT: 8090,
  workers: 2,
  scripts_directory: "C:/Scripts/CURRENT",
  work_directory: "C:/Scripts/WORK", 
  login_timeout: 3600, // seconds

  windows_ps1: "Powershell.exe",
  windows_ps1_appendix: "-ExecutionPolicy ByPass -File",
  windows_py: "Python.exe",

  linux_ps1: "pwsh",
  linux_ps1_appendix: "",
  linux_py: "python3",

  audit_enabled: true, // set to false if you don't need audit/if using AuditNull, this will improve the preformance

  log_file:           "bell.log", // path is relative to place where node is started or provide an absolute path
  log_commands:       true,
  log_errors:         true,
  log_audit_commands: false,  // typically for debug only
  log_folder:         false,  // usually short and can be logged
  log_result:         false,  // typically for debug only
  log_encoding:       true,   // log successfull base64 image encoding done by server.

  // secrets (usually passwords), quoted in tags with ###secret name###
  secrets:            new Map([
      ['mypassword', 'Welcome123']
    ])
};
