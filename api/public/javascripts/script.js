
//DELETE USER
const deleteUser = async (userId) => {
    if (!confirm("Silmek istediğine emin misin?")) return
    try {
        const response = await fetch("http://localhost:3000/api/users/delete", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ _id: userId })
        })

        if (!response.ok) {
            throw new Error("Not deleted")
        }
        alert("Deleted")
        location.reload()
    } catch (error) {
        alert("Hata oluştu: " + error)
    }
}
//ADD USER
document.getElementById("addUserForm").addEventListener("submit", async function (e) {

    e.preventDefault()

    try {
        const formObj = {
            email: this.email.value,
            password: this.password.value,
            first_name: this.first_name.value,
            last_name: this.last_name.value,
            phone_number: this.phone_number.value,
            roles: this.roles.value
        }

        const response = await fetch("/api/users/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formObj)
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message)
        }

        alert("User Added")
        location.reload()

    } catch (error) {
        alert("Hata oluştu: " + error.message)
    }
})
//EDIT USER
let editUserID;
function getValueOfEditUserInput(user) {
    const editInput = document.querySelectorAll("#editUserForm input")
    const editUser = JSON.parse(user)
    editUserID = editUser._id
    editInput[0].value = editUser.email
    editInput[2].value = editUser.first_name
    editInput[3].value = editUser.last_name
    editInput[4].value = editUser.phone_number
    document.getElementById("edit_is_active").value = editUser.is_active ? "true" : "false"
    
}
document.getElementById("editUserForm").addEventListener("submit", async function (e) {

    e.preventDefault()

    try {
        let is_active;
        if(this.is_active.value == "false")is_active = false
        else is_active = true
        
        

        const formObj = {
            _id:editUserID,
            password: this.password.value ? this.password.value : null,
            first_name: this.first_name.value ? this.first_name.value : null,
            last_name: this.last_name.value ? this.last_name.value : null,
            phone_number: this.phone_number.value ? this.phone_number.value : null,
            is_active,
            roles:this.roles.value ? [this.roles.value] : null
        }
        

        const response = await fetch("/api/users/update", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formObj)
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message)
        }

        alert("User Updated")
        location.reload()

    } catch (error) {
        alert("Hata oluştu: " + error.message)
    }
})
//ADD CATEGORY
document.getElementById("addCategoryModal").addEventListener("submit", async function (e) {

    e.preventDefault()

    try {
        const formObj = {
            name: this.name.value
        }

        const response = await fetch("/api/users/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formObj)
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message)
        }

        alert("User Added")
        location.reload()

    } catch (error) {
        alert("Hata oluştu: " + error.message)
    }
})