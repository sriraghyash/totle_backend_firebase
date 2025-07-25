import { SupportQueryMaster } from "../Models/SupportModels/SupportQueriesMaster.js";

export const SupportQueriesMasterSeeder = async()=>{
    try{
        await SupportQueryMaster.bulkCreate([
            { id:1, order: 1, name: "Technical Issue" },
            { id:2, order: 2, name: "Test-related" },
            { id:3, order: 3, name: "Session / Booking" },
            { id:4, order: 4, name: "Payments" },
            { id:5, order: 5,name: "Suggestions" },
            { id:6, order: 6, name: "Other" },
        ],{
            ignoreDuplicates: true
        });
        console.log( "Support queries master data seeded successfully" );
    } catch (error) {
        console.error("Error seeding support queries master data:", error);
    }
}