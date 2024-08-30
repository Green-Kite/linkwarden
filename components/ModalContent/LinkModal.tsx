import React, { useEffect, useState } from "react";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import getPublicUserData from "@/lib/client/getPublicUserData";
import { useTranslation } from "next-i18next";
import { useUser } from "@/hooks/store/user";
import { useDeleteLink, useGetLink, useUpdateLink } from "@/hooks/store/links";
import Drawer from "../Drawer";
import LinkDetails from "../LinkDetails";
import Link from "next/link";
import usePermissions from "@/hooks/usePermissions";
import { useRouter } from "next/router";
import { dropdownTriggerer } from "@/lib/client/utils";
import toast from "react-hot-toast";
import clsx from "clsx";

type Props = {
  onClose: Function;
  onDelete: Function;
  onUpdateArchive: Function;
  onPin: Function;
  link: LinkIncludingShortenedCollectionAndTags;
  activeMode?: "view" | "edit";
};

export default function LinkModal({
  onClose,
  onDelete,
  onUpdateArchive,
  onPin,
  link,
  activeMode,
}: Props) {
  const { t } = useTranslation();
  const getLink = useGetLink();
  const { data: user = {} } = useUser();

  const [collectionOwner, setCollectionOwner] = useState({
    id: null as unknown as number,
    name: "",
    username: "",
    image: "",
    archiveAsScreenshot: undefined as unknown as boolean,
    archiveAsMonolith: undefined as unknown as boolean,
    archiveAsPDF: undefined as unknown as boolean,
  });

  useEffect(() => {
    const fetchOwner = async () => {
      if (link.collection.ownerId !== user.id) {
        const owner = await getPublicUserData(
          link.collection.ownerId as number
        );
        setCollectionOwner(owner);
      } else if (link.collection.ownerId === user.id) {
        setCollectionOwner({
          id: user.id as number,
          name: user.name,
          username: user.username as string,
          image: user.image as string,
          archiveAsScreenshot: user.archiveAsScreenshot as boolean,
          archiveAsMonolith: user.archiveAsScreenshot as boolean,
          archiveAsPDF: user.archiveAsPDF as boolean,
        });
      }
    };

    fetchOwner();
  }, [link.collection.ownerId]);

  const isReady = () => {
    return (
      link &&
      (collectionOwner.archiveAsScreenshot === true
        ? link.pdf && link.pdf !== "pending"
        : true) &&
      (collectionOwner.archiveAsMonolith === true
        ? link.monolith && link.monolith !== "pending"
        : true) &&
      (collectionOwner.archiveAsPDF === true
        ? link.pdf && link.pdf !== "pending"
        : true) &&
      link.readable &&
      link.readable !== "pending"
    );
  };

  useEffect(() => {
    (async () => {
      await getLink.mutateAsync({
        id: link.id as number,
      });
    })();

    let interval: any;

    if (!isReady()) {
      interval = setInterval(async () => {
        await getLink.mutateAsync({
          id: link.id as number,
        });
      }, 5000);
    } else {
      if (interval) {
        clearInterval(interval);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [link?.monolith]);

  const permissions = usePermissions(link.collection.id as number);

  const router = useRouter();

  const isPublicRoute = router.pathname.startsWith("/public") ? true : false;

  const deleteLink = useDeleteLink();

  const [mode, setMode] = useState<"view" | "edit">(activeMode || "view");

  return (
    <Drawer
      toggleDrawer={onClose}
      className="sm:h-screen items-center relative"
    >
      <div className="absolute top-3 left-0 right-0 flex justify-between px-3">
        <div
          className="bi-x text-xl btn btn-sm btn-circle text-base-content opacity-50 hover:opacity-100 z-10"
          onClick={() => onClose()}
        ></div>

        <div className="flex gap-1 h-8 rounded-full bg-neutral-content bg-opacity-50 text-base-content p-1 text-xs duration-100 select-none z-10">
          <div
            className={clsx(
              "py-1 px-2 cursor-pointer duration-100 rounded-full font-semibold",
              mode === "view" && "bg-primary bg-opacity-50"
            )}
            onClick={() => {
              setMode("view");
            }}
          >
            View
          </div>
          <div
            className={clsx(
              "py-1 px-2 cursor-pointer duration-100 rounded-full font-semibold",
              mode === "edit" && "bg-primary bg-opacity-50"
            )}
            onClick={() => {
              setMode("edit");
            }}
          >
            Edit
          </div>
        </div>

        <div className="flex gap-2">
          <div className={`dropdown dropdown-end z-20`}>
            <div
              tabIndex={0}
              role="button"
              onMouseDown={dropdownTriggerer}
              className="btn btn-sm btn-circle text-base-content opacity-50 hover:opacity-100 z-10"
            >
              <i title="More" className="bi-three-dots text-xl" />
            </div>
            <ul
              className={`dropdown-content z-[20] menu shadow bg-base-200 border border-neutral-content rounded-box`}
            >
              {(permissions === true || permissions?.canUpdate) && (
                <li>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      (document?.activeElement as HTMLElement)?.blur();
                      onPin();
                    }}
                    className="whitespace-nowrap"
                  >
                    {link?.pinnedBy && link.pinnedBy[0]
                      ? t("unpin")
                      : t("pin_to_dashboard")}
                  </div>
                </li>
              )}
              {link.type === "url" && permissions === true && (
                <li>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      (document?.activeElement as HTMLElement)?.blur();
                      onUpdateArchive();
                    }}
                    className="whitespace-nowrap"
                  >
                    {t("refresh_preserved_formats")}
                  </div>
                </li>
              )}
              {(permissions === true || permissions?.canDelete) && (
                <li>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={async (e) => {
                      (document?.activeElement as HTMLElement)?.blur();
                      console.log(e.shiftKey);
                      if (e.shiftKey) {
                        const load = toast.loading(t("deleting"));

                        await deleteLink.mutateAsync(link.id as number, {
                          onSettled: (data, error) => {
                            toast.dismiss(load);

                            if (error) {
                              toast.error(error.message);
                            } else {
                              toast.success(t("deleted"));
                            }
                          },
                        });
                        onClose();
                      } else {
                        onDelete();
                        onClose();
                      }
                    }}
                    className="whitespace-nowrap"
                  >
                    {t("delete")}
                  </div>
                </li>
              )}
            </ul>
          </div>
          <Link
            href={
              isPublicRoute ? `/public/links/${link.id}` : `/links/${link.id}`
            }
            target="_blank"
            className="bi-box-arrow-up-right btn-circle text-base-content opacity-50 hover:opacity-100 btn btn-sm select-none z-10"
          ></Link>
        </div>
      </div>

      <div className="w-full">
        <LinkDetails
          activeLink={link}
          className="sm:mt-0 -mt-11"
          mode={mode}
          setMode={(mode: "view" | "edit") => setMode(mode)}
        />
      </div>
    </Drawer>
  );
}
