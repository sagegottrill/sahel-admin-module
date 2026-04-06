interface ProgressStepperProps {
  currentStep: number;
  steps: string[];
}

export default function ProgressStepper({ currentStep, steps }: ProgressStepperProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  index + 1 <= currentStep
                    ? 'bg-[#4a9d7e] text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index + 1}
              </div>
              <span className={`text-xs mt-2 text-center ${
                index + 1 <= currentStep ? 'text-[#1e3a5f] font-medium' : 'text-gray-500'
              }`}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                index + 1 < currentStep ? 'bg-[#4a9d7e]' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
