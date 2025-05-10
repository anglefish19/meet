import { fileToGraffitiObject, graffitiFileSchema } from "@graffiti-garden/wrapper-files";
import { GraffitiObjectToFile } from "@graffiti-garden/wrapper-files/vue";

export async function Profile() {
  return {
    props: ["profileSchema", "username"],

    data() {
      return {
        saving: false,
        name: "",
        pronouns: "",
        profile: undefined,
        graffitiFileSchema
      }
    },

    components: { GraffitiObjectToFile },

    methods: {
      // TODO: DELETE (was for debugging)
      // async recoverOrphans() {
      //   const orphans = this.$graffiti.recoverOrphans({}, this.$graffitiSession.value);
      //   const orphansArray = [];
      //   for await (const { object } of orphans) {
      //     orphansArray.push(object);
      //     // await this.$graffiti.delete(object, this.$graffitiSession.value);
      //   }
      //   console.log(orphansArray);
      // },
      async checkProfiles() {
        const profiles = this.$graffiti.discover(
          // channels
          ["ajz-meet-profiles"],
          // schema
          this.profileSchema
        );
  
        const profileArray = [];
        for await (const { object } of profiles) {
          profileArray.push(object);
        }
  
        console.log(profileArray);
      },

      async deleteProfile(profile) {
        await this.$graffiti.delete(profile, this.$graffitiSession.value);
        this.$router.push("/");
        this.$graffiti.logout(this.$graffitiSession.value);
      },

      async setProfile(e, profile) {
        this.saving = true;

        let patch;

        if (this.name && this.pronouns) {
          patch = {
            value: [
              { "op": "add", "path": "/name", "value": this.name },
              { "op": "add", "path": "/pronouns", "value": this.pronouns },
            ],
          }
        } else if (this.name) {
          patch = {
            value: [
              { "op": "add", "path": "/name", "value": this.name }
            ],
          }
        } else if (this.pronouns) {
          patch = {
            value: [
              { "op": "add", "path": "/pronouns", "value": this.pronouns },
            ],
          }
        } else {
          alert("Nothing to save.");
          this.saving = false;
          this.revealInput(e);
          return;
        }

        await this.$graffiti.patch(
          patch,
          profile,
          this.$graffitiSession.value,
        );

        this.saving = false;
        await this.revealInput(e);
      },

      async revealInput(e) {
        const profiles = this.$graffiti.discover(
          // channels
          [this.username],
          // schema
          this.profileSchema
        );

        const profileArray = [];
        for await (const { object } of profiles) {
          profileArray.push(object);
        }

        profile = profileArray[0];

        e.target.closest("div").lastElementChild.classList.toggle("reveal");
        e.target.closest("div").lastElementChild.firstElementChild.firstElementChild.focus();
      },
    },

    template: await fetch("./Components/profile.html").then((r) => r.text()),
  };
}