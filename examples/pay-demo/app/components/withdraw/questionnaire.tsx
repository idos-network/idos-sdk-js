import { ClipboardList } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Radio, RadioGroup } from "~/components/ui/radio-group";
import { Separator } from "~/components/ui/separator";

const declarations = [
  {
    id: "is_pep",
    label: "Are you a Politically Exposed Person (PEP)?",
    description:
      "A PEP is someone who holds or has held a prominent public function, such as a head of state, senior politician, or senior executive of a state-owned corporation.",
  },
  {
    id: "is_sanction",
    label: "Are you subject to any sanctions?",
    description:
      "This includes being listed on any government or international sanctions list, or being a resident of a sanctioned country.",
  },
  {
    id: "is_crime",
    label: "Have you been involved in criminal activity?",
    description:
      "This includes any past or pending criminal charges, convictions, or investigations related to financial crimes.",
  },
] as const;

type DeclarationId = (typeof declarations)[number]["id"];

interface DueQuestionnaireProps {
  onSubmit: (answers: { id: string; value: string }[]) => void;
  isLoading?: boolean;
}

export function DueQuestionnaire({ onSubmit, isLoading = false }: DueQuestionnaireProps) {
  const [answers, setAnswers] = useState<Record<DeclarationId, string>>({
    is_pep: "false",
    is_sanction: "false",
    is_crime: "false",
  });

  const handleChange = (id: DeclarationId, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    const formatted = declarations.map((d) => ({
      id: d.id,
      value: answers[d.id],
    }));
    onSubmit(formatted);
  };

  return (
    <Card className="mx-auto max-w-2xl shadow-sm gap-5">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-info/10 text-info-foreground">
          <ClipboardList className="h-6 w-6" />
        </div>
        <CardTitle>Declarations</CardTitle>
        <CardDescription>
          Please answer the following compliance questions to proceed
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {declarations.map((declaration, index) => (
          <div key={declaration.id}>
            {index > 0 && <Separator className="mb-4" />}
            <fieldset disabled={isLoading} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <legend className="text-sm font-medium leading-tight text-foreground">
                  {declaration.label}
                </legend>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {declaration.description}
                </p>
              </div>
              <RadioGroup
                value={answers[declaration.id]}
                onValueChange={(value) => handleChange(declaration.id, value)}
                className="flex flex-row gap-4"
              >
                <label
                  htmlFor={`${declaration.id}-no`}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Radio id={`${declaration.id}-no`} value="false" />
                  <span className="text-sm text-foreground">No</span>
                </label>
                <label
                  htmlFor={`${declaration.id}-yes`}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Radio id={`${declaration.id}-yes`} value="true" />
                  <span className="text-sm text-foreground">Yes</span>
                </label>
              </RadioGroup>
            </fieldset>
          </div>
        ))}
      </CardContent>

      <Separator />

      <CardFooter>
        <Button className="w-full" size="lg" disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Submitting...
            </>
          ) : (
            "Submit Declarations"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
