import { defineAsyncComponent } from "vue";
import { NavBar } from "./navbar.js";
import { SideBar } from "./sidebar.js";
import { ChatWindow } from "./chatWindow.js";
import { Profile } from "./profile.js";
import { Calendar } from "./calendar.js";

export async function UserContent() {
  return {
    props: ["username", "view", "chatName", "channel"],

    data() {
      return {
        clickedChannel: this.channel,
        profileSchema: {
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
        },

        inviteSchema: {
          properties: {
            value: {
              required: [
                "activity",
                "target",
                "title",
                "published",
                "participants",
                "channel",
              ],
              properties: {
                activity: { enum: ["Invite"] },
                target: { enum: ["Chat"] },
                participants: {
                    type: "array",
                    items: { type: "string" },
                },
                published: { type: "number" },
                title: { type: "string" },
                channel: { type: "string" },
              },
            },
          },
        },
      }
    },

    components: { 
      NavBar: defineAsyncComponent(NavBar),
      SideBar: defineAsyncComponent(SideBar),
      ChatWindow: defineAsyncComponent(ChatWindow),
      Profile: defineAsyncComponent(Profile),
      Calendar: defineAsyncComponent(Calendar),
    },

    methods: {
      getChannel(channel) {
        this.clickedChannel = channel;
      }
    },

    // methods: {
    //   async checkAuth() {
    //     const profiles = this.$graffiti.discover(
    //       // channels
    //       ["ajz-meet-profiles"],
    //       // schema
    //       this.profileSchema
    //     );
  
    //     const profileArray = [];
    //     for await (const { object } of profiles) {
    //       profileArray.push(object);
    //     }
    //     const profile = profileArray.filter(p => p.actor == this.$graffitiSession.value.actor)[0];
    //     if (profile) {
    //       if (!profile.value.username == this.$route.path.split("/")[1])
    //       router.push("/" + profile.value.username + "/chats");
    //     } else {
    //       router.push("/profile-setup");
    //     }
    //     return false;
    //   }
    // },

    template: await fetch("./Components/userContent.html").then((r) => r.text()),
  };
}