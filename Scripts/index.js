import { createApp, defineAsyncComponent } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { GraffitiLocal } from "@graffiti-garden/implementation-local";
import { GraffitiRemote } from "@graffiti-garden/implementation-remote";
import { GraffitiPlugin } from "@graffiti-garden/wrapper-vue";
import { UserContent } from "./userContent.js";
import { GeneralContent } from "./generalContent.js";
import { SetupContent } from "./setupContent.js"; 

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
  ],
});

let session;

createApp({
  components: {
    GeneralContent: defineAsyncComponent(GeneralContent),
    SetupContent: defineAsyncComponent(SetupContent),
    UserContent: defineAsyncComponent(UserContent)
  },

  beforeCreate() {
    session = this.$graffitiSession;
  },

  methods: {
    async login() {
      await this.setupProfile();
    },

    // TODO: MODIFY THIS SO IT INTERFACES WITH SetupContent
    async setupProfile() {
      const profiles = this.$graffiti.discover(
        // channels
        [this.$graffitiSession.value.actor],
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
        const profile = profileArray[0];
        router.push("/" + profile.value.username + "/chats");
      }
    },

    // NOT SURE IF I'LL NEED THIS
    copyActor() {
      navigator.clipboard.writeText(
          this.$graffitiSession.value.actor,
      );
      alert("copied!");
  },

    logout() {
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

window.onload = function() {
  if (session.value && history.state.current == "/") {
    router.push("/" + session.value.actor + `/chats`);
  }
}