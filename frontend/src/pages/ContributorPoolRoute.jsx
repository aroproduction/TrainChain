import React, { useContext } from "react";
import Navbar from "../components/Navbar";
import DashboardLayout from "../Layout/DashboardLayout";
import { UserContext } from "../context/UserContext";
import ContributorPool from "./ContributorPool";

const ContributorPoolRoute = () => {
  const { userAddress } = useContext(UserContext);

  if (userAddress) {
    return (
      <DashboardLayout>
        <ContributorPool />
      </DashboardLayout>
    );
  }

  return (
    <>
      <Navbar />
      <ContributorPool withNavbar />
    </>
  );
};

export default ContributorPoolRoute;
