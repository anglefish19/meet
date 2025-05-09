import { fileToGraffitiObject, graffitiFileSchema } from "@graffiti-garden/wrapper-files";
import { GraffitiObjectToFile } from "@graffiti-garden/wrapper-files/vue";

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

export async function SetupContent() {
  return {
    emits: ["username"],

    data() {
      return {
        firstName: "",
        lastName: "",
        username: "",
        profile: undefined,
        profilePic: undefined,
        profilePicURL: undefined,
        creating: false,
        graffitiFileSchema
      };
    },

    components: { GraffitiObjectToFile },

    methods: {
      async setupProfile() {
        await this.getProfile();
        if (this.profile) {
          await this.editProfile();
        } else {
          await this.createProfile();
        }
        this.$emit("username", {username: this.username});
      },

      async getProfile() {
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

        this.profile = profileArray.filter(p => p.actor == this.$graffitiSession.value.actor)[0];
      },

      async editProfile() {
        if (this.username != "" && !(/^\w+$/.test(this.username))) {
          alert("A username may only contain letters, numbers, and underscores.");
          return;
        } else if (this.username != "" &&  await this.checkIfTaken(this.username)) {
          alert("Sorry, this username is already taken.");
          return;
        }
        this.firstName = this.firstName ? this.firstName : this.profile.value.firstName;
        this.lastName = this.lastName ? this.lastName : this.profile.value.lastName;
        this.username = this.username ? this.username : this.profile.value.username;
        this.profilePicURL = this.profilePicURL ? this.profilePicURL : this.profile.value.profilePicURL;

        const patch = {
          value: [
            { "op": "replace", "path": "/firstName", "value": this.firstName },
            { "op": "replace", "path": "/lastName", "value": this.lastName },
            { "op": "replace", "path": "/name", "value": this.firstName + " " + this.lastName },
            { "op": "replace", "path": "/username", "value": this.username },
          ],
        }

        if (this.profilePicURL && !this.profile.value.profilePicURL) {
          patch["value"].push({ "op": "add", "path": "/profilePicURL", "value": this.profilePicURL });
        } else if (this.profilePicURL) {
          patch["value"].push({ "op": "replace", "path": "/profilePicURL", "value": this.profilePicURL });
        }

        await this.$graffiti.patch(
          patch,
          this.profile,
          this.$graffitiSession.value
        );

        this.$router.push(`/` + this.username + `/profile`);
      },

      async createProfile() {
        if (!this.firstName) {
          alert("Please enter your first name!");
          return;
        } else if (!this.lastName) {
          alert("Please enter your last name!");
          return;
        } else if (!this.username) {
          alert("Please enter a username!");
          return;
        } else if (!(/^\w+$/.test(this.username))) {
          alert("A username may only contain letters, numbers, and underscores.");
          return;
        }

        // check if username is already used
        if (await this.checkIfTaken(this.username)) {
          alert("Sorry, this username is already taken.");
          return;
        }

        this.creating = true;

        await this.$graffiti.put(
          {
            channels: [this.username, "ajz-meet-profiles"],
            // channels: [this.$graffitiSession.value.actor, "designftw-2025-studio2"],
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
            }
          },
          this.$graffitiSession.value,
        );

        this.creating = false;

        this.$router.push(`/` + this.username + `/chats`);
      },

      async checkIfTaken(username) {
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
        const profile = profileArray.filter(p => p.value.username == username);
        return profile.length != 0;
      },

      async setProfilePic(event) {
        // delete previous upload if changing picture
        if (this.profilePic) {
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