const getAuthCookieOptions = ({ clear = false } = {}) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  ...(clear ? {} : { maxAge: 3 * 24 * 60 * 60 * 1000 }),
});

const setAuthCookie = (res, token) => {
  res.cookie("token", token, getAuthCookieOptions());
};

const clearAuthCookie = (res) => {
  res.clearCookie("token", getAuthCookieOptions({ clear: true }));
};

module.exports = {
  getAuthCookieOptions,
  setAuthCookie,
  clearAuthCookie,
};
