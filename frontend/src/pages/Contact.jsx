import React from "react";
import Navbar from "../components/Navbar";
import { N } from "ethers";

function Contact() {
    return (
        <>
        <Navbar />
        <section className="bg-white text-gray-900 py-24 px-8 min-h-screen">
        <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Contact TrainChain</h2>
            <p className="text-lg text-gray-700 mb-6">
            Have questions or feedback? We'd love to hear from you! Reach out to
            us using the contact form below.
            </p>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <input
                type="text"
                placeholder="Your Name"
                className="p-3 bg-gray-100 rounded-lg shadow-lg border border-gray-300"
            />
            <input
                type="email"
                placeholder="Your Email"
                className="p-3 bg-gray-100 rounded-lg shadow-lg border border-gray-300"
            />
            <textarea
                placeholder="Your Message"
                className="p-3 bg-gray-100 rounded-lg shadow-lg border border-gray-300 col-span-2"
            ></textarea>
            <div className="col-span-2 flex justify-center w-full">
                <button className="p-3 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 w-1/2">
                    Submit
                </button>
            </div>
            </form>
        </div>
        </section>
        </>
    );
}

export default Contact;
