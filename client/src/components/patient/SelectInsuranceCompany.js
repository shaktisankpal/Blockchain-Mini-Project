import ProviderAccess from "./ProviderAccess";

function SelectInsuranceCompany() {
  return (
    <ProviderAccess
      orgName="insurance"
      noun="insurance company"
      plural="insurance companies"
      title="Your Insurance"
      subtitle="Give your insurer access so it can review the claims you file."
    />
  );
}

export default SelectInsuranceCompany;
