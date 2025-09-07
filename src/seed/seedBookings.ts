import { Booking, User } from "../models";

// Helper to pick a random element (assumes non-empty array)
function rand<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)] as T; // arr guaranteed non-empty where used
}

const statuses: any[] = ["PENDING", "CONFIRMED", "SEATED", "COMPLETED"];

export default async function seedBookings() {
    const users = await User.findAll({ limit: 5 });
    if (!users.length) {
        console.log(
            "No users found to attach bookings. Skipping booking seed."
        );
        return;
    }

    // We will create up to 10 bookings if they don't already exist
    for (let i = 0; i < 10; i++) {
        const user = rand(users);
        const bookedAt = new Date();
        bookedAt.setDate(bookedAt.getDate() + i + 1); // future days

        const existing = await Booking.findOne({
            where: { userId: user.id, bookedAt },
        });
        if (existing) continue;

        await Booking.create({
            userId: user.id as any,
            numberOfPeople: Math.ceil(Math.random() * 6),
            status: rand(statuses),
            bookedAt,
        } as any);
    }

    console.log("Booking seed complete");
}
