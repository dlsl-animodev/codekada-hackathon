"use client";

import { useState } from "react";
import FirstPage from "@/components/landing-page/first-page";
import SecondPage from "@/components/landing-page/second-page";

export default function OnboardingPage() {
    // the page state
    const [page, setPage] = useState(0);

    switch (page) {
        case 0:
            return <FirstPage setPage={setPage} />;
        case 1:
            return <SecondPage setPage={setPage} />;
        default:
            return <FirstPage setPage={setPage} />;
    }
}
