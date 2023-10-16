import React, { useEffect, useState } from 'react'
import socket from '../../socket';
import ACTIONS from '../../socket/actions';
import { v4 } from 'uuid';
import { useNavigate } from 'react-router';


export default function Main() {
    const [rooms, updateRooms] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        socket.on(ACTIONS.SHARE_ROOMS, ({ rooms = [] } = {}) => {
            updateRooms(rooms);
        })
    }, [])



    return (
        <div>
            <ul>
                {rooms.map(roomID => (<div key={roomID}>
                    <li>
                        {roomID}
                        <button onClick={() => navigate(`/room/${roomID}`)}>join room</button>
                    </li>
                </div>))}
            </ul>
            <button onClick={() => navigate(`/room/${v4()}`)}>Create room</button>
        </div>
    )
}
