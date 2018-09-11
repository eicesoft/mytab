let app = new Vue({
  el: "#app",
  data() {
    return {
      activeName: "tab",
      historys: [],
      winlist: {},
      winCount: 0,
      sessions: [],
      currentWindow: null,
      filter: ""
    };
  },
  created() {
    let that = this;

    chrome.storage.sync.get(["history", "sessions"], function(result) {
      if (result["history"] == undefined) {
        chrome.storage.sync.set({ history: [] });
      } else {
        that.historys = result["history"];
      }

      if (result["sessions"] == undefined) {
        chrome.storage.sync.set({ sessions: [] });
      } else {
        that.sessions = result["sessions"];
      }

      chrome.windows.getCurrent(function(win) {
        that.currentWindow = win;
        chrome.windows.getAll(function(wins) {
          let windows = {};
          for (var i in wins) {
            let id = wins[i].id;
            windows[id] = wins[i];

            chrome.tabs.query({ windowId: id }, function(tabs) {
              console.log(JSON.stringify(tabs));
              let _tabs = {};
              for (let index in tabs) {
                _tabs[tabs[index].id] = tabs[index];
              }
              windows[id]["tabs"] = _tabs;
              that.winCount++;
              if (that.winCount >= wins.length) {
                console.log("OK");
                that.winlist = windows;
              }
            });
          }
        });
      });
    });
  },
  filters: {
    img_handler(url) {
      if (url == undefined || url == "") {
        return "/images/page.png";
      } else {
        return url;
      }
    },
    tab_active(active) {
      console.log(active);
      //   return active != undefined && active ? "tab-item active" : "tab-item";
      if (active != undefined) {
        return active ? "title active" : "title";
      } else {
        return "title";
      }
    }
  },
  computed: {
    windows() {
      if (this.filter == "") {
        return this.winlist;
      } else {
        let windows = {};

        for (let i in this.winlist) {
          let window = Object.assign({}, this.winlist[i]);
          console.log(window);
          let tabs = {};
          for (let t in window["tabs"]) {
            let tab = window["tabs"][t];
            if (
              tab.title
                .toLocaleLowerCase()
                .indexOf(this.filter.toLocaleLowerCase()) != -1 ||
              tab.url
                .toLocaleLowerCase()
                .indexOf(this.filter.toLocaleLowerCase()) != -1
            ) {
              tabs[t] = tab;
            }
          }
          window["tabs"] = tabs;
          console.log(tabs);

          windows[i] = window;
        }
        return windows;
      }
    },
    sort_historys() {
      return this.historys.sort(function(a, b) {
        return a["created"] > b["created"] ? 0 : 1;
      });
    }
  },
  methods: {
    title(tab) {
      return tab.title + "<br/>" + tab.url;
    },
    goto() {
      let tab = null;
      for (var i in this.windows) {
        for (let j in this.windows[i]["tabs"]) {
          tab = this.windows[i]["tabs"][j];
          break;
        }
      }
      if (tab != null) {
        //Select first tab goto
        this.changeTab(tab);
      }
    },
    changeWindow(id) {
      chrome.windows.update(parseInt(id), { focused: true });
    },
    pinTab(tab) {
      tab.pinned = !tab.pinned;
      chrome.tabs.update(tab.id, { pinned: tab.pinned });
    },
    refreshTab(tab) {
      chrome.tabs.reload(parseInt(tab.id), { bypassCache: true });
    },
    changeTab(tab) {
      if (tab.windowId == this.currentWindow.id) {
        chrome.tabs.update(tab.id, { active: true });
      } else {
        chrome.windows.update(tab.windowId, { focused: true }, function() {
          chrome.tabs.update(tab.id, { active: true });
        });
      }
    },
    closeTab(tab) {
      delete this.winlist[tab.windowId]["tabs"][tab.id];
      chrome.tabs.remove(tab.id);
    },
    openHistory(history) {
      chrome.tabs.create({ url: history["url"] });
      this.deleteHistory(history);
    },
    deleteHistory(history) {
      let new_history = [];
      for (let i in this.historys) {
        if (this.historys[i]["id"] != history["id"]) {
          new_history.push(this.historys[i]);
        }
      }
      this.historys = new_history;
      chrome.storage.sync.set({ history: this.historys });
    },
    openSession(session) {
      chrome.tabs.create({ url: session["url"] });
      //   this.deleteSession(session);
    },
    deleteSession(session) {
      let new_session = [];
      for (let i in this.sessions) {
        if (this.sessions[i]["id"] != session["id"]) {
          new_session.push(this.sessions[i]);
        }
      }
      this.sessions = new_session;
      chrome.storage.sync.set({ sessions: this.sessions });
    },
    addSession(tab) {
      delete this.winlist[tab.windowId]["tabs"][tab.id];
      chrome.tabs.remove(tab.id);

      this.sessions.push({
        id: parseInt(Math.random() * 100000),
        url: tab.url,
        title: tab.title,
        created: new Date().getTime(),
        favIcon: tab.favIconUrl
      });
      chrome.storage.sync.set({ sessions: this.sessions });
    },

    img_err(event) {
      event.target.src = "/images/page.png";
    }
  }
});
