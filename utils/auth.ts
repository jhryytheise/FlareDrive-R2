const THUMBNAIL_PREFIX = "_$flaredrive$/thumbnails/";

function parseAllowList(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function matchesAllowList(targetPath, allowList) {
  if (allowList.includes("*")) return true;
  return allowList.some((allow) => targetPath.startsWith(allow));
}

/**
 * 环境变量格式: 变量名=用户名, 值=密码:权限路径
 * 例如: admin=123456:*
 *       user1=mypassword:user1/,shared/
 *
 * 原始项目用 用户名:密码 作为变量名，但 Cloudflare Pages 不支持冒号。
 */
function getAllowListForRequest(context) {
  const headers = new Headers(context.request.headers);
  const authorization = headers.get("Authorization");
  if (authorization && authorization.startsWith("Basic ")) {
    const decoded = atob(authorization.split("Basic ")[1]); // "admin:123456"
    const colonIndex = decoded.indexOf(":");
    if (colonIndex === -1) return null;

    const username = decoded.substring(0, colonIndex);
    const password = decoded.substring(colonIndex + 1);

    // 查找 env 中以用户名为 key 的变量
    const envValue = context.env[username];
    if (envValue) {
      // 值格式: "密码:权限路径"  例如 "123456:*" 或 "mypass:user1/,shared/"
      const firstColon = envValue.indexOf(":");
      if (firstColon === -1) return null;

      const envPassword = envValue.substring(0, firstColon);
      const paths = envValue.substring(firstColon + 1);

      if (password === envPassword) {
        return parseAllowList(paths);
      }
    }
  }
  if (context.env["GUEST"]) {
    return parseAllowList(context.env["GUEST"]);
  }
  return null;
}

export function can_access_path(context, targetPath) {
  if (targetPath.startsWith(THUMBNAIL_PREFIX)) return true;
  const allowList = getAllowListForRequest(context);
  if (!allowList) return false;
  return matchesAllowList(targetPath, allowList);
}

export function get_allow_list(context) {
  return getAllowListForRequest(context);
}

export function get_auth_status(context) {
  const dopath = context.request.url.split("/api/write/items/")[1];
  if (!dopath) return false;
  return can_access_path(context, dopath);
}
