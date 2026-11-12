import ProviderAccess from "./ProviderAccess";

function SelectDoctor() {
  return (
    <ProviderAccess
      orgName="doctor"
      noun="doctor"
      title="Your Doctors"
      subtitle="Turn access on for the doctors who should see your history and write prescriptions for you."
    />
  );
}

export default SelectDoctor;
