import { useCallback, useEffect, useRef } from "react";
import useStateWithCallback from "./useStateWithCallback";
import socket from '../socket';
import ACTIONS from '../socket/actions';


export const LOCAL_MEDIA = 'LOCAL_MEDIA';

export default function useWebRTC(roomID) {
    const peerConnections = useRef({});
    const localMediaStream = useRef(null);
    const peerMediaElements = useRef({
        [LOCAL_MEDIA]: null,
    });

    const [clients, setClients] = useStateWithCallback([]);


    const addNewClient = useCallback((newClient, cb) => {
        if (!clients.includes(newClient)) {
            setClients(list => [...list, newClient], cb)
        }
    }, [clients, setClients])


    useEffect(() => {
        async function screenCapture() {
            localMediaStream.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    width: 1280,
                    height: 720,
                }
            })
        }

        screenCapture().then(() => socket.emit(ACTIONS.JOIN, {
            room: roomID,
        })).catch(e => console.log('Ошибка при захвате экрана', e));

        addNewClient(LOCAL_MEDIA, () => {
            const localVideoElement = peerMediaElements.current[LOCAL_MEDIA];

            if (localVideoElement) {
                console.log('Пользователь с ссылкой добавился')
                localVideoElement.volume = 0;
                localVideoElement.srcObject = localMediaStream.current;
                console.log(localVideoElement);
                console.log(localMediaStream)
            }
        });

    }, [roomID])

    const createRefElement = useCallback((clientID, node) => {
        peerMediaElements.current[clientID] = node;
    }, [])


    return { clients, createRefElement }

}