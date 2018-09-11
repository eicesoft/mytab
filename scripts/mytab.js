let app = new Vue({
  el: "#app",
  data() {
    return {
      historys: [],
      winlist: {},
      winCount: 0,
      currentWindow: null,
      filter: ""
    };
  },
  created() {
    let that = this;
    chrome.storage.sync.get(["history"], function(result) {
      if (result["history"] == undefined) {
        chrome.storage.sync.set({ history: [] });
      } else {
        that.historys = result["history"];
      }
      console.log(that.historys);

      chrome.windows.getCurrent(function(win) {
        that.currentWindow = win;
        chrome.windows.getAll(function(wins) {
          let windows = {};
          for (var i in wins) {
            let id = wins[i].id;
            windows[id] = wins[i];

            chrome.tabs.query({ windowId: id }, function(tabs) {
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
    tab_active(active) {
      console.log(active);
      //   return active != undefined && active ? "tab-item active" : "tab-item";
      if (active != undefined) {
        return active ? "tab-item active" : "tab-item";
      } else {
        return "tab-item";
      }
    }
  },
  directives: {
    focus: {
      inserted: function(el) {
        el.focus();
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
          windows[i] = window;
        }
        // console.log(this.winlist);
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
    goto() {
      let tab = null;
      for (var i in this.windows) {
        for (let j in this.windows[i]["tabs"]) {
          tab = this.windows[i]["tabs"][j];
          break;
        }
      }

      console.log(tab);
      if (tab != null) {
        this.changeTab(tab);
      }
    },
    changeWindow(id) {
      console.log(id);
      chrome.windows.update(parseInt(id), { focused: true });
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
      console.log(this.winlist[tab.windowId]["tabs"][tab.id]);
      delete this.winlist[tab.windowId]["tabs"][tab.id];
      chrome.tabs.remove(tab.id);
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
    img_err(event) {
      event.target.src = "/images/page.png";
    }
  }
});
