// Injected into index.html to pre-create the demo account in localStorage
(function(){
  try {
    var KEY = "geenie_accounts";
    var accounts = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (!accounts["demo@geenie.studio"]) {
      accounts["demo@geenie.studio"] = {
        email: "demo@geenie.studio",
        passwordHash: btoa(encodeURIComponent("demo123")),
        fullName: "Demo User",
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(KEY, JSON.stringify(accounts));
    }
  } catch(e){}
})();
