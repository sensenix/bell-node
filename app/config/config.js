module.exports = {
  scripts_directory: "C:/Scripts/CURRENT",

  windows_ps1: "Powershell.exe",
  windows_ps1_appendix: "-ExecutionPolicy ByPass -File",
  windows_py: "Python.exe",

  linux_ps1: "pwsh",
  linux_ps1_appendix: "",
  linix_py: "python3",

  audit_enabled: true, // set to false if you don't need audit/if using AuditNull, this will improve the preformance

  log_file:           "bell.log", // path is relative to place where node is started or provide an absolute path
  log_commands:       true,
  log_errors:         true,
  log_audit_commands: false, // typically for debug only
  log_folder:         true,  // usually short and can be logged
  log_result:         false  // typically for debug only
};
