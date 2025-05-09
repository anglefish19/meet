import { createApp, defineAsyncComponent } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { GraffitiLocal } from "@graffiti-garden/implementation-local";
import { GraffitiRemote } from "@graffiti-garden/implementation-remote";
import { GraffitiPlugin } from "@graffiti-garden/wrapper-vue";
import { UserContent } from "./userContent.js";
import { GeneralContent } from "./generalContent.js";
import { SetupContent } from "./setupContent.js";
// import { Scheduler } from "./scheduler.js";

const profileSchema = {
  properties: {
    value: {
      required: [
        "name",
        "username",
        "describes",
        "generator",
        "target",
      ],
      properties: {
        name: { type: "string" },
        username: { type: "string" },
        describes: { type: "string" },
        generator: { enum: ["https://anglefish19.github.io/meet/"] },
        target: { enum: ["Profile"] },
      },
    },
  }
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", component: GeneralContent },
    { path: "/profile-setup", component: SetupContent },
    { path: "/:username/:view", component: UserContent, props: true },
    { path: "/:username/:view/:chatName/:channel", component: UserContent, props: true },
    { path: "/:username/:chatName/:channel", component: UserContent, props: true },

    // { path: "/scheduler", component: Scheduler },
  ],
});

let session;

createApp({
  data() {
    return {
      username: "",
    }
  },

  components: {
    GeneralContent: defineAsyncComponent(GeneralContent),
    SetupContent: defineAsyncComponent(SetupContent),
    UserContent: defineAsyncComponent(UserContent),

    // Scheduler: defineAsyncComponent(Scheduler),
  },

  mounted() {
    if (!this.$graffitiSession.value) {
      this.$graffiti.sessionEvents.addEventListener('login', () => {
        this.setupProfile();
      });
      
      this.$graffiti.sessionEvents.addEventListener('logout', () => {
        this.logout();
      });
    } else{
      this.$graffiti.sessionEvents.addEventListener('logout', () => {
        this.logout();
      });
    }
    document.addEventListener('username', this.getUsername);
  },

  methods: {
    async setupProfile() {
      const profiles = this.$graffiti.discover(
        // channels
        ["ajz-meet-profiles"],
        // schema
        profileSchema
      );

      const profileArray = [];
      for await (const { object } of profiles) {
        profileArray.push(object);
      }

      if (!this.$graffitiSession.value) {
        alert("You must be logged in to continue!");
      } else if (profileArray.length == 0) {
        router.push("/profile-setup");
      } else {
        const profile = profileArray.filter(p => p.actor == this.$graffitiSession.value.actor)[0];
        if (profile) {
          this.username = profile.value.username;
          if (this.$route.path == "/") {
            router.push("/" + profile.value.username + "/chats");
          }
        } else {
          router.push("/profile-setup");
        }
      }
    },

    getUsername(username) {
      this.username = username["username"];
    },

    // NOT SURE IF I'LL NEED THIS
    copyActor() {
      navigator.clipboard.writeText(
        this.$graffitiSession.value.actor,
      );
      alert("copied!");
    },

    logout() {
      this.username = "";
      router.push("/");
    },
  },
})
  .use(GraffitiPlugin, {
    graffiti: new GraffitiLocal(),
    // graffiti: new GraffitiRemote(),
  })
  .use(router)
  .mount("#app");