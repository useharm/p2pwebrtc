import { useParams } from 'react-router';
import useWebRTC, { LOCAL_MEDIA } from '../../hooks/useWebRTC';

export default function Room() {
    const { id: roomID } = useParams();
    const { clients, createRefElement } = useWebRTC(roomID);
    console.log(roomID)

    return (
        <div>
            {clients.map(clientID => (<div key={clientID}>
                <video
                    ref={instance => {
                        createRefElement(clientID, instance)
                    }}
                    autoPlay
                    playsInline
                    muted={clientID === LOCAL_MEDIA}
                />
            </div>))}
        </div>
    )
}
