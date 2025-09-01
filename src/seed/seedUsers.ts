import { User } from "../models";

async function seedUsers() {
    const usersData = [
        {
            name: "Alice Johnson",
            email: "alice@example.com",
            password: "Password123!",
            phoneNumber: "+15550000001",
            role: "user",
        },
        {
            name: "Bob Smith",
            email: "bob@example.com",
            password: "Password123!",
            phoneNumber: "+15550000002",
            role: "user",
        },
        {
            name: "Charlie Admin",
            email: "charlie.admin@example.com",
            password: "AdminPass123!",
            phoneNumber: "+15550000003",
            role: "admin",
        },
    ];

    for (const data of usersData) {
        const existing = await User.unscoped().findOne({
            where: { email: data.email },
        });
        if (!existing) {
            await User.create(data as any);
        }
    }
    console.log("User seed complete");
}

seedUsers()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
