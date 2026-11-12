import ProviderAccess from "./ProviderAccess";

function SelectLab() {
  return (
    <ProviderAccess
      orgName="lab"
      noun="lab"
      title="Your Labs"
      subtitle="Give a lab access so it can see the tests your doctors ordered and add reports."
    />
  );
}

export default SelectLab;
