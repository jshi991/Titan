import React, { useState } from "react";
import { Group, Text, rem } from "@mantine/core";
import { IconUpload, IconPhoto, IconX } from "@tabler/icons-react";
import { Dropzone, DropzoneProps } from "@mantine/dropzone";
import ChatBox from "./chat";

export default function UploadData(props: Partial<DropzoneProps>) {
  const [loading, setLoading] = useState(false);
  const [filesUploaded, setFilesUploaded] = useState(false);

  const handleDrop = (files: File[]) => {
    setLoading(true);

    files.forEach((file) => {
      console.log(`File: ${file.name}, Type: ${file.type}, Size: ${file.size}`);
    });

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("file", file);
    });

    fetch("http://127.0.0.1:5000/upload_data", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        setLoading(false);
        setFilesUploaded(true);
      })
      .catch((error) => {
        console.error("Error:", error);
        setLoading(false);
      });
  };

  return (
    <div>
      {!filesUploaded ? (
        <Dropzone
          onDrop={handleDrop}
          onReject={(files) => {
            console.log("penis penis penius penuis penis penis ", files);
          }}
          maxSize={5 * 1024 ** 2} // 5MB
          accept={{"text/*": []}}
          {...props}
          style={{
            border: "2px dashed blue",
            borderRadius: rem(8),
            padding: rem(16),
          }}
        >
          <Group
            justify="center"
            gap="xl"
            mih={220}
            style={{ pointerEvents: "none" }}
          >
            <Dropzone.Accept>
              <IconUpload
                style={{
                  width: rem(52),
                  height: rem(52),
                  color: "var(--mantine-color-blue-6)",
                }}
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                style={{
                  width: rem(52),
                  height: rem(52),
                  color: "var(--mantine-color-red-6)",
                }}
                stroke={1.5}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconPhoto
                style={{
                  width: rem(52),
                  height: rem(52),
                  color: "var(--mantine-color-dimmed)",
                }}
                stroke={1.5}
              />
            </Dropzone.Idle>

            <div>
              <Text size="xl" inline>
                {loading
                  ? "Uploading..."
                  : "Drag files here or click to select files"}
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                Attach as many files as you like, each file should not exceed
                5MB
              </Text>
            </div>
          </Group>
        </Dropzone>
      ) : (
        <ChatBox />
      )}
    </div>
  );
}
