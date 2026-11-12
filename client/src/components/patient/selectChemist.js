import ProviderAccess from "./ProviderAccess";

function SelectChemist() {
  return (
    <ProviderAccess
      orgName="pharmacy"
      noun="pharmacy"
      plural="pharmacies"
      title="Your Pharmacy"
      subtitle="Give a pharmacy access so it can see your prescribed medicines and record what it dispensed."
    />
  );
}

export default SelectChemist;
