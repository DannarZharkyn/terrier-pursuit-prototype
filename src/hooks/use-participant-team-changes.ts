"use client";

import { useEffect, useRef } from "react";
import { participantTeamChangedEvent } from "@/lib/participant-realtime";

export function useParticipantTeamChanges(onChange: () => void) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const handleChange = () => onChangeRef.current();
    window.addEventListener(participantTeamChangedEvent, handleChange);
    return () => window.removeEventListener(participantTeamChangedEvent, handleChange);
  }, []);
}
