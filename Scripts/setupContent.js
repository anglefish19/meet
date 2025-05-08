import { fileToGraffitiObject, graffitiFileSchema} from "@graffiti-garden/wrapper-files";
import { GraffitiObjectToFile } from "@graffiti-garden/wrapper-files/vue";

export async function SetupContent() {
  return {
    data() {
      return {
        firstName: "",
        lastName: "",
        username: "",
        profilePic: undefined,
        profilePicURL: undefined,
        profilePicObj: undefined,
        creating: false,
        graffitiFileSchema
      };
    },

    components: { GraffitiObjectToFile },

    methods: {
      async createProfile() {
        if (!this.firstName) {
          alert("Please enter your first name!");
          return;
        } else if (!this.lastName) {
          alert("Please enter your last name!");
          return;
        } 
        // TODO: ADD A CHECK TO MAKE SURE USERNAMES ARE UNIQUE
        else if (!this.username) {
          alert("Please enter a username!");
          return;
        } else if (!(/^\w+$/.test(this.username))) {
          alert("A username may only contain letters, numbers, and underscores.");
          return;
        }

        this.creating = true;

        await this.$graffiti.put(
          {
            channels: [this.$graffitiSession.value.actor],
            value: {
              firstName: this.firstName,
              lastName: this.lastName,
              name: this.firstName + " " + this.lastName,
              username: this.username,
              profilePicURL: this.profilePicURL,

              activity: 'CreateProfile',
              target: "Profile",
              describes: this.$graffitiSession.value.actor,
              created: Date.now(),
              generator: "https://anglefish19.github.io/meet/",
            },
            allowed: this.members,
          },
          this.$graffitiSession.value,
        );

        this.creating = false;

        this.$router.push(`/` + this.username + `/chats`);
      },

      async setProfilePic(event) {
        // delete previous upload if changing picture
        if (this.profilePicURL) {
          const object = await this.$graffiti.get(
            this.profilePicURL, // url
            graffitiFileSchema // schema,
          )
          await this.$graffiti.delete(object, this.$graffitiSession.value);
        }

        const target = event.target;
        if (!target.files?.length) return;
        this.profilePic = target.files[0];

        try {
          const object = await fileToGraffitiObject(
            this.profilePic,
          );
          const { url } = await this.$graffiti.put(
            object,
            this.$graffitiSession.value,
          );
          this.profilePicURL = url;
        } catch (e) {
          return alert(e);
        } finally {
          this.profilePic = undefined;
        }
      }
    },

    template: await fetch("./Components/setupContent.html").then((r) => r.text()),
  };
}