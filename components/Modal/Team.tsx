// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faPlus, faUser } from "@fortawesome/free-solid-svg-icons";
import useCollectionStore from "@/store/collections";
import { ExtendedCollection, NewCollection } from "@/types/global";
import { useSession } from "next-auth/react";
import RequiredBadge from "../RequiredBadge";
import addMemberToCollection from "@/lib/client/addMemberToCollection";
import ImageWithFallback from "../ImageWithFallback";

type Props = {
  toggleCollectionModal: Function;
};

export default function AddCollection({ toggleCollectionModal }: Props) {
  const [newCollection, setNewCollection] = useState<NewCollection>({
    name: "",
    description: "",
    members: [],
  });

  const [memberEmail, setMemberEmail] = useState("");

  const { addCollection } = useCollectionStore();

  const session = useSession();

  const submit = async () => {
    console.log(newCollection);

    const response = await addCollection(newCollection as NewCollection);

    if (response) toggleCollectionModal();
  };

  const setMemberState = (newMember: any) => {
    setNewCollection({
      ...newCollection,
      members: [...newCollection.members, newMember],
    });

    setMemberEmail("");
  };

  return (
    <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
      <p className="text-xl text-sky-500 mb-2 text-center">New Collection</p>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full">
          <p className="text-sm font-bold text-sky-300 mb-2">
            Name
            <RequiredBadge />
          </p>
          <input
            value={newCollection.name}
            onChange={(e) =>
              setNewCollection({ ...newCollection, name: e.target.value })
            }
            type="text"
            placeholder="e.g. Example Collection"
            className="w-full rounded-md p-3 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
          />
        </div>

        <div className="w-full">
          <p className="text-sm font-bold text-sky-300 mb-2">Description</p>
          <input
            value={newCollection.description}
            onChange={(e) =>
              setNewCollection({
                ...newCollection,
                description: e.target.value,
              })
            }
            type="text"
            placeholder="Collection description"
            className="w-full rounded-md p-3 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
          />
        </div>
      </div>

      <hr className="border rounded my-2" />

      <p className="text-sm font-bold text-sky-300">Members</p>
      <div className="relative">
        <input
          value={memberEmail}
          onChange={(e) => {
            setMemberEmail(e.target.value);
          }}
          type="text"
          placeholder="Email"
          className="w-full rounded-md p-3 pr-12 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />

        <div
          onClick={() =>
            addMemberToCollection(
              session.data?.user.email as string,
              memberEmail,
              newCollection as unknown as ExtendedCollection,
              setMemberState,
              "ADD"
            )
          }
          className="absolute flex items-center justify-center right-2 top-2 bottom-2 bg-sky-500 hover:bg-sky-400 duration-100 text-white w-9 rounded-md cursor-pointer"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
        </div>
      </div>

      {newCollection.members[0] ? (
        <p className="text-center text-gray-500 text-xs sm:text-sm">
          (All Members have <b>Read</b> access to this collection.)
        </p>
      ) : null}

      <div className="h-36 overflow-auto flex flex-col gap-3 rounded-md shadow-inner">
        {newCollection.members.map((e, i) => {
          return (
            <div
              key={i}
              className="relative border p-2 rounded-md border-sky-100 flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
            >
              <FontAwesomeIcon
                icon={faClose}
                className="absolute right-2 top-2 text-gray-500 h-4 hover:text-red-500 duration-100 cursor-pointer"
                title="Remove Member"
                onClick={() => {
                  const updatedMembers = newCollection.members.filter(
                    (member) => {
                      return member.email !== e.email;
                    }
                  );
                  setNewCollection({
                    ...newCollection,
                    members: updatedMembers,
                  });
                }}
              />
              <div className="flex items-center gap-2">
                <ImageWithFallback
                  key={i}
                  // @ts-ignore
                  src={`/api/avatar/${e.id}`}
                  className="h-10 w-10 shadow rounded-full border-[3px] border-sky-100"
                >
                  <div className="text-white bg-sky-500 h-10 w-10 shadow rounded-full border-[3px] border-sky-100 flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="w-5 h-5" />
                  </div>
                </ImageWithFallback>
                <div>
                  <p className="text-sm font-bold text-sky-500">{e.name}</p>
                  <p className="text-sky-900">{e.email}</p>
                </div>
              </div>
              <div className="flex sm:block items-center gap-5">
                <div>
                  <p className="font-bold text-sm text-gray-500">Permissions</p>
                  <p className="text-xs text-gray-400 mb-2">
                    (Click to toggle.)
                  </p>
                </div>

                <div>
                  <label className="cursor-pointer mr-1">
                    <input
                      type="checkbox"
                      id="canCreate"
                      className="peer sr-only"
                      checked={e.canCreate}
                      onChange={() => {
                        const updatedMembers = newCollection.members.map(
                          (member) => {
                            if (member.email === e.email) {
                              return { ...member, canCreate: !e.canCreate };
                            }
                            return member;
                          }
                        );
                        setNewCollection({
                          ...newCollection,
                          members: updatedMembers,
                        });
                      }}
                    />
                    <span className="text-sky-900 peer-checked:bg-sky-500 text-sm hover:bg-sky-200 duration-75 peer-checked:text-white rounded p-1 select-none">
                      Create
                    </span>
                  </label>

                  <label className="cursor-pointer mr-1">
                    <input
                      type="checkbox"
                      id="canUpdate"
                      className="peer sr-only"
                      checked={e.canUpdate}
                      onChange={() => {
                        const updatedMembers = newCollection.members.map(
                          (member) => {
                            if (member.email === e.email) {
                              return { ...member, canUpdate: !e.canUpdate };
                            }
                            return member;
                          }
                        );
                        setNewCollection({
                          ...newCollection,
                          members: updatedMembers,
                        });
                      }}
                    />
                    <span className="text-sky-900 peer-checked:bg-sky-500 text-sm hover:bg-sky-200 duration-75 peer-checked:text-white rounded p-1 select-none">
                      Update
                    </span>
                  </label>

                  <label className="cursor-pointer mr-1">
                    <input
                      type="checkbox"
                      id="canDelete"
                      className="peer sr-only"
                      checked={e.canDelete}
                      onChange={() => {
                        const updatedMembers = newCollection.members.map(
                          (member) => {
                            if (member.email === e.email) {
                              return { ...member, canDelete: !e.canDelete };
                            }
                            return member;
                          }
                        );
                        setNewCollection({
                          ...newCollection,
                          members: updatedMembers,
                        });
                      }}
                    />
                    <span className="text-sky-900 peer-checked:bg-sky-500 text-sm hover:bg-sky-200 duration-75 peer-checked:text-white rounded p-1 select-none">
                      Delete
                    </span>
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mx-auto mt-2 bg-sky-500 text-white flex items-center gap-2 py-2 px-5 rounded-md select-none font-bold cursor-pointer duration-100 hover:bg-sky-400"
        onClick={submit}
      >
        <FontAwesomeIcon icon={faPlus} className="h-5" />
        Add Collection
      </div>
    </div>
  );
}