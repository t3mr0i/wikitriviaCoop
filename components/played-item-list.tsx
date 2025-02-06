import React, {useState, useEffect} from "react";
import { Droppable } from "react-beautiful-dnd";
import { Item } from "../types/item";
import ItemCard from "./item-card";
import styles from "../styles/played-item-list.module.scss";
import Moves from "./moves";

interface PlayedItemListProps {
    badlyPlacedIndex: number | null;
    isDragging: boolean;
    items: Item[];
}


export default function PlayedItemList(props: PlayedItemListProps) {
  const { badlyPlacedIndex, isDragging, items } = props;

  const [flippedId, setFlippedId] = useState<null | string>(null);

  useEffect(() => {
    if (isDragging && flippedId !== null) {
      setFlippedId(null);
    }
  }, [flippedId, isDragging]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.listContainer}>
        <Droppable droppableId="played" direction="horizontal">
          {provided => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={styles.list}
            >
              <div className={styles.timelineContainer}>
                <div className={styles.timeline}></div>
              </div>
              <div className={styles.items}>
                {items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ItemCard
                      draggable={badlyPlacedIndex !== null}
                      flippedId={flippedId}
                      index={index}
                      item={item}
                      setFlippedId={setFlippedId}
                    />
                    {/*  TODO: show number of moves */}
                    <Moves moves={item.moves} />
                  </React.Fragment>
                ))}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}
