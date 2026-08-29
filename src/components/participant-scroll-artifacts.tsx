import Image from "next/image";

export function ParticipantScrollArtifacts() {
  return (
    <div className="participant-scroll-artifacts" aria-hidden="true">
      <Image
        src="/images/participant-stories/vintage-map-compass.png"
        alt=""
        width={900}
        height={600}
        className="participant-artifact participant-artifact-map"
        sizes="180px"
      />
      <Image
        src="/images/participant-stories/vintage-balloon.png"
        alt=""
        width={467}
        height={700}
        className="participant-artifact participant-artifact-balloon"
        sizes="96px"
      />
      <Image
        src="/images/participant-stories/vintage-map-compass.png"
        alt=""
        width={900}
        height={600}
        className="participant-artifact participant-artifact-map-lower"
        sizes="150px"
      />
    </div>
  );
}
