import { useParams } from 'react-router';
import useWebRTC, { LOCAL_MEDIA } from '../../hooks/useWebRTC';

export default function Room() {
    const { id: roomID } = useParams();
    const { clients, createRefElement } = useWebRTC(roomID);
    console.log('ОТРИСОВКА КОМНАТЫ')

    return (
        <div>
            {clients.map(clientID => {
                console.log(clients)
                return (<div key={clientID}>
                    <video
                        ref={instance => {
                            console.log('ОТРИСОВКА Видео')
                            createRefElement(clientID, instance)
                        }}
                        autoPlay
                        playsInline
                        muted={clientID === LOCAL_MEDIA}
                    />
                </div>)
            })}
        </div>
    )
}
