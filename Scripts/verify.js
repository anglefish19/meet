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