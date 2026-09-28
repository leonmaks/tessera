// scripts/windows-user-info-shim.cjs
const os = require("node:os");
const originalUserInfo = os.userInfo;

os.userInfo = function userInfoWithSandboxFallback(...args) {
  try {
    return originalUserInfo.apply(this, args);
  } catch (error) {
    if (
      process.platform !== "win32" ||
      error?.info?.syscall !== "uv_os_get_passwd"
    ) {
      throw error;
    }

    return {
      uid: -1,
      gid: -1,
      username: process.env.USERNAME ?? "unknown",
      homedir: process.env.USERPROFILE ?? os.homedir(),
      shell: null,
    };
  }
};
