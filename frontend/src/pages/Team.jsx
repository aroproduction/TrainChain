import React from "react";
import Navbar from "../components/Navbar";
import sayan from "../assets/sayan.jpg";
import shibam from "../assets/Shibam.jpg";
import aritra from "../assets/Aritra.jpeg";
import sharnabho from "../assets/Sharnabho.jpg";
import trisagni from "../assets/Trisagni.jpg";

const teamMembers = [
    {
        name: "Sayan Patra",
        role: "Blockchain Development and Smart Contracts",
        image: sayan,
        description: "Helped with blockchain integration and smart contract development."
    },
    {
        name: "Aritra Dutta Banik",
        role: "AI Model Integration and Dockerization",
        image: aritra,
        description: "Did the AI model training possible and packed into docker image."
    },
    {
        name: "Shibam Pandit",
        role: "Backend Development and Database Management",
        image: shibam,
        description: "Worked with backend APIs and database management."
    },
    {
        name: "Sharnabho Chatterjee",
        role: "Design and Frontend Development",
        image: sharnabho,
        description: "Designed the UI/UX and developed the frontend components."
    },
    {
        name: "Trisgani Mandal",
        role: "Frontend Development",
        image: trisagni,
        description: "Contributed to building responsive frontend interfaces."
    }
];

const Team = () => {
    return (
        <>
            <Navbar />
            <section className="bg-white text-gray-900 pt-24 pb-16 px-8 min-h-screen">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6">Meet Our Team</h2>
                    <p className="text-lg text-gray-700 mb-12">
                        The dedicated minds behind TrainChain, working together to revolutionize decentralized AI training.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center">
                        {teamMembers.map((member, index) => (
                            <div
                                key={index}
                                className="p-6 bg-gray-100 rounded-lg shadow-lg text-center w-full max-w-xs"
                            >
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-32 h-32 mx-auto rounded-full mb-4 object-cover"
                                />
                                <h3 className="text-xl font-semibold">{member.name}</h3>
                                <p className="text-gray-500 text-sm mb-2">{member.role}</p>
                                <p className="text-gray-700">{member.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
};

export default Team;