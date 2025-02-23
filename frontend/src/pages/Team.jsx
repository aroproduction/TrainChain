import React from "react";
import Navbar from "../components/Navbar";
import sayan from "../assets/sayan.jpg";
import shibam from "../assets/Shibam.jpg";
import aritra from "../assets/Aritra.jpeg";
import dibyajyoti from "../assets/Dibyajyoti.jpg";

const teamMembers = [
    {
        name: "Sayan Patra",
        role: "Frontend Developer",
        image: sayan,
        description: "Helped with the fronted part of the project using React and Tailwind CSS."
    },
    {
        name: "Aritra Dutta Banik",
        role: "AI Model Integration and Docker",
        image: aritra,
        description: "Did the AI model training and packed into docker image."
    },
    {
        name: "Shibam Pandit",
        role: "Backend Developer and Smart Contracts",
        image: shibam,
        description: "Worked with backend and deployed the smart contract."
    },
    {
        name: "Dibyajyoti Das",
        role: "Software development",
        image: dibyajyoti,
        description: "Developed the software and helped with future AI model integration."
    }
];

const Team = () => {
    return (
        <>
            <Navbar />
            <section className="bg-white text-gray-900 pt-24 px-8 min-h-screen">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6">Meet Our Team</h2>
                    <p className="text-lg text-gray-700 mb-12">
                        The dedicated minds behind TrainChain, working together to revolutionize decentralized AI training.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="p-6 bg-gray-100 rounded-lg shadow-lg text-center">
                                <img src={member.image} alt={member.name} className="w-32 h-32 mx-auto rounded-full mb-4" />
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