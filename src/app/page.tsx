// src/app/page.tsx
"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Countdown } from "@/ui/components/Countdown";
import { Intro } from "@/ui/components/Intro";
import { Quiz } from "@/ui/components/Quiz";
import { SubjectSelect } from "@/ui/components/SubjectSelect";

export default function Home() {
  const [displayView, setDisplayView] = useState("intro");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  return (
    <main className="h-viewport flex flex-col w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {
          {
            intro: (
              <Intro
                onGetStartedClick={() => {
                  setDisplayView("subject-select");
                }}
              />
            ),
            "subject-select": (
              <SubjectSelect
                selectedSubject={selectedSubject}
                selectedLevel={selectedLevel}
                onSubjectChange={setSelectedSubject}
                onLevelChange={setSelectedLevel}
                onContinue={() => {
                  setDisplayView("countdown");
                }}
              />
            ),
            countdown: (
              <Countdown
                onGoClick={() => {
                  setDisplayView("quiz");
                }}
              />
            ),
            quiz: <Quiz subject={selectedSubject} level={selectedLevel} />,
          }[displayView]
        }
      </AnimatePresence>
    </main>
  );
}