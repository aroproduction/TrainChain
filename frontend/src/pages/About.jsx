import React from "react";
import Navbar from "../components/Navbar";

const About = () => {
  return (
    <div>
    <Navbar />
    <section className="bg-white text-gray-900 pt-24 px-8 min-h-screen">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-6">About TrainChain</h2>
        <p className="text-lg text-gray-600 mb-6">
          TrainChain is a decentralized AI training platform that connects model
          requestors with high-performance GPU contributors using blockchain
          technology.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-gray-100 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">For Requestors</h3>
            <p className="text-gray-700">
              Submit AI model training jobs with a custom dataset and offer
              reward tokens to contributors who complete the training.
            </p>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">For Contributors</h3>
            <p className="text-gray-700">
              Utilize your high-performance GPU to train AI models, earning
              tokens for each completed job while supporting decentralized AI.
            </p>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Powered by Blockchain</h3>
            <p className="text-gray-700">
              Secure and transparent transactions using smart contracts ensure
              fairness and trust between requestors and contributors.
            </p>
          </div>
        </div>
        <p className="text-lg text-gray-600 mt-8">
          With TrainChain, AI model training becomes decentralized, accessible,
          and efficient. Join us in revolutionizing AI computation!
        </p>
      </div>
    </section>
    </div>
  );
};

export default About;
