import Contact from "../models/contact";

const contacts = [
    {
        name: "John Visitor",
        email: "john.visitor@example.com",
        subject: "Table availability",
        message: "Hi, is there a table for 4 available this Friday at 7 PM?",
    },
    {
        name: "Laura Feedback",
        email: "laura.feedback@example.com",
        subject: "Great service!",
        message: "Just wanted to say the staff were wonderful last night.",
    },
    {
        name: "Mike Issue",
        email: "mike.issue@example.com",
        subject: "Order mix-up",
        message: "My delivery had a missing item. Can you assist?",
    },
];

export default async function seedContacts() {
    for (const c of contacts) {
        const existing = await Contact.findOne({
            where: { email: c.email, subject: c.subject },
        });
        if (!existing) {
            await Contact.create(c as any);
        }
    }
    console.log("Contact seed complete");
}
