module.exports = {

  PORT: 8090,
  scripts_directory: "C:/Scripts/CURRENT",

  windows_ps1: "Powershell.exe",
  windows_ps1_appendix: "-ExecutionPolicy ByPass -File",
  windows_py: "Python.exe",

  linux_ps1: "pwsh",
  linux_ps1_appendix: "",
  linix_py: "python3",

  // tags can contain sensitive information (passwords), so server replaces them with id's when sending to a client
  // for debug purposes you can disable it so you can restart server whithout breaking the functionality of a tree.
  tags_hiding: true, 

  audit_enabled: true, // set to false if you don't need audit/if using AuditNull, this will improve the preformance

  log_file:           "bell.log", // path is relative to place where node is started or provide an absolute path
  log_commands:       true,
  log_errors:         true,
  log_audit_commands: false,  // typically for debug only
  log_folder:         false,  // usually short and can be logged
  log_result:         false   // typically for debug only
};
