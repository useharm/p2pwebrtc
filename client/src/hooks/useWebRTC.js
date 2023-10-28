import { useCallback, useEffect, useRef } from "react";
import useStateWithCallback from "./useStateWithCallback";
import socket from '../socket';
import ACTIONS from '../socket/actions';
import freeice from 'freeice';


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

        async function handleNewPeer({ peerID, createOffer }) {
            if (peerID in peerConnections.current) {
                return console.warn(`Already connected to peer ${peerID}`)
            }
            peerConnections.current[peerID] = new RTCPeerConnection({
                iceServers: freeice(),
            })
            peerConnections.current[peerID].onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit(ACTIONS.RELAY_ICE, {
                        peerID,
                        iceCandidate: event.candidate,
                    })
                }
            }

            let tracksNumber = 0;
            peerConnections.current[peerID].ontrack = ({ streams: [remoteStream] }) => {
                tracksNumber++;

                if (tracksNumber === 2) { // video and audio tracks received
                    addNewClient(peerID, () => {
                        peerMediaElements.current[peerID].srcObject = remoteStream;
                    })
                }
            }

            localMediaStream.current.getTracks().forEach(track => {
                peerConnections.current[peerID].addTrack(track, localMediaStream.current)
            })

            if (createOffer) {
                const offer = await peerConnections.current[peerID].createOffer();
                await peerConnections.current[peerID].setLocalDescription(offer);

                socket.emit(ACTIONS.RELAY_SDP, {
                    peerID,
                    sessionDescription: offer,
                })
            }
        }

        socket.on(ACTIONS.ADD_PEER, handleNewPeer)
    }, [])


    useEffect(() => {
        async function screenCapture() {
            console.log('SCREEN CAPTURE')
            localMediaStream.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    width: 1280,
                    height: 720,
                }
            })
            addNewClient(LOCAL_MEDIA, () => {
                const localVideoElement = peerMediaElements.current[LOCAL_MEDIA];
                console.log('LOCAL_MEDIA 1')
                if (localVideoElement) {
                    console.log('LOCAL_MEDIA 2')
                    localVideoElement.volume = 0;
                    localVideoElement.srcObject = localMediaStream.current;
                }
            });
        }

        screenCapture().then(() => socket.emit(ACTIONS.JOIN, {
            room: roomID,
        })).catch(e => console.log('Ошибка при захвате экрана', e));

        return () => {
            localMediaStream.current.getTracks().forEach(track => track.stop())
            socket.emit(ACTIONS.LEAVE)
        }

    }, [roomID])

    const createRefElement = useCallback((clientID, node) => {
        console.log('PEER NODE')
        peerMediaElements.current[clientID] = node;
    }, [])


    return { clients, createRefElement }

}