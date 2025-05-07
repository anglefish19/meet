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
        } else if (!this.profilePic) {
          alert("Please upload a profile photo!");
          return;
        }

        this.creating = true;

        // const channel = crypto.randomUUID(); // This creates a random string
        // if (this.members != "") {
        //   this.members = this.members.split(", ");
        //   this.members.push(this.$graffitiSession.value.actor);
        // } else {
        //   this.members = [this.$graffitiSession.value.actor];
        // }

        // await this.$graffiti.put(
        //   {
        //     channels: this.members,
        //     value: {
        //       activity: 'Invite',
        //       target: "Chat",
        //       participants: this.members,
        //       title: this.newChatName,
        //       published: Date.now(),
        //       channel: channel,
        //     },
        //     allowed: this.members,
        //   },
        //   this.$graffitiSession.value,
        // );

        // const chatName = this.newChatName;

        this.creating = false;
        // this.members = "";
        // this.newChatName = "";

        // this.$router.push(`/` + this.$graffitiSession.value.actor + `/chats/` + chatName + `/` + channel);
      },

      async setProfilePic(event) {
        if (this.profilePicURL) {
          console.log(this.profilePicURL);
          const object = await this.$graffiti.get(
            this.profilePicURL, // url
            graffitiFileSchema // schema,
          )
          await this.$graffiti.delete(object, this.$graffitiSession.value);

          console.log("deleted previous upload");
          // const check = await this.$graffiti.get(
          //   this.profilePicURL, // url
          //   graffitiFileSchema // schema,
          // )
          // console.log(check);
        } 
        
        // FOR TESTING
        // else {
          // const object = await this.$graffiti.get(
          //   "graffiti:local:n8lKMHe94dOT6PS_1ge_IxbvHuwT6AxA", // url
          //   graffitiFileSchema // schema,
          // )
          // console.log("previous ", object);
          // await this.$graffiti.delete(object, this.$graffitiSession.value);
          // const check = await this.$graffiti.get(
          //       this.profilePicURL, // url
          //       graffitiFileSchema // schema,
          //     )
          //     console.log(check);
        // }

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

        console.log("current url ", this.profilePicURL);
      }
    },

    template: await fetch("./Components/setupContent.html").then((r) => r.text()),
  };
}