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
            console.log('ADD NEW PEER', peerID, createOffer)
            if (peerID in peerConnections.current) {
                return console.warn(`Already connected to peer ${peerID}`)
            }
            peerConnections.current[peerID] = new RTCPeerConnection({
                iceServers: freeice(),
            })
            peerConnections.current[peerID].onicecandidate = (event) => {
                console.log('new ice')
                if (event.candidate) {
                    socket.emit(ACTIONS.RELAY_ICE, {
                        peerID,
                        iceCandidate: event.candidate,
                    })
                }
            }

            let tracksNumber = 0;
            peerConnections.current[peerID].ontrack = ({ streams: [remoteStream] }) => {
                console.log('отрабатывает трек', remoteStream)
                tracksNumber++;

                if (tracksNumber === 2) { // video and audio tracks received
                    console.log('добавляется чмо')
                    addNewClient(peerID, () => {
                        if (peerMediaElements.current[peerID]) {
                            peerMediaElements.current[peerID].srcObject = remoteStream;
                        } else {
                            // FIX LONG RENDER IN CASE OF MANY CLIENTS
                            let settled = false;
                            const interval = setInterval(() => {
                                if (peerMediaElements.current[peerID]) {
                                    peerMediaElements.current[peerID].srcObject = remoteStream;
                                    settled = true;
                                }

                                if (settled) {
                                    clearInterval(interval);
                                }
                            }, 1000);
                        }
                    })
                }
            }

            localMediaStream.current.getTracks().forEach(track => {
                console.log('добавился трек', track)
                peerConnections.current[peerID].addTrack(track, localMediaStream.current);
            });

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
        return () => {
            socket.off(ACTIONS.ADD_PEER);
        }
    }, [])

    useEffect(() => {
        async function setRemoteMedia({ peerID, sessionDescription }) {
            peerConnections.current[peerID]?.setRemoteDescription(new RTCSessionDescription(sessionDescription));


            if (sessionDescription.type === 'offer') {
                const answer = await peerConnections.current[peerID].createAnswer();
                await peerConnections.current[peerID].setLocalDescription(answer);

                socket.emit(ACTIONS.RELAY_SDP, {
                    peerID,
                    sessionDescription: answer
                })
            }
        }


        socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia)
        return () => {
            socket.off(ACTIONS.SESSION_DESCRIPTION);
        }
    }, [])

    useEffect(() => {


        socket.on(ACTIONS.ICE_CANDIDATE, ({ peerID, iceCandidate }) => {
            peerConnections.current[peerID].addIceCandidate(new RTCIceCandidate(iceCandidate))
        })
        return () => {
            socket.off(ACTIONS.ICE_CANDIDATE);
        }
    }, [])

    useEffect(() => {
        function handleRemovePeer({ peerID }) {
            if (peerConnections.current[peerID]) {
                peerConnections.current[peerID].close()
            }
            delete peerConnections.current[peerID];
            delete peerMediaElements.current[peerID];

            setClients(list => list.filter(client => client !== peerID));
        }


        socket.on(ACTIONS.REMOVE_PEER, handleRemovePeer)
        return () => {
            socket.off(ACTIONS.REMOVE_PEER);
        }
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