export async function ITD() {
    return {
        props: ["imgSrc", "text", "description"],
        template: await fetch("./Components/itd.html").then((r) => r.text()),
    };
}